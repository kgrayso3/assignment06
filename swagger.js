const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');

const mariadb = require('mariadb');
const pool = mariadb.createPool({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'sample',
        port: 3306,
        connectionLimit: 5
});

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');

const options = {
        swaggerDefinition: {
                info: {
                        title: 'Assignment 07 API',
                        version: '1.0.0',
                        description: 'API for assignment 07 interfacing with the MariaDB database'
                },
                host: '104.131.110.188:3000',
                basePath: '/'
        },
        apis: ['./server.js']
};

const specs = swaggerJsdoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(cors());

app.get('/', (req, res) => {
        res.send('hello world!');
});

app.get('/say', (req, res) => {
        const callCloudFunction = async () => {
                try {
                        const response = await axios.get('https://assignment-07-437928066275.us-central1.run.app',
                        { params: { keyword: req.query.keyword } });
                        res.send(response.data);
                } catch (error) {
                        console.error('Error calling function:', error);
                }
        };

        callCloudFunction();
});

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Returns agents from db
 *     responses:
 *       200:
 *         description: 'All agents'
 *         content:
 *           application/json:
 *             example: { "agentName": "Jack" }
 */

app.get('/agents', async (req, res) => {

        res.setHeader('X-Custom-Header', "Agents from the MariaDB database");
        res.setHeader('Content-Type', 'application/json');

        let filters = req.query;
        let keys = Object.keys(filters);
        let values = Object.values(filters);

        let rows;
        let conn;
        try {
                conn = await pool.getConnection();
                if (keys.length >= 1) {
                        let rows = await conn.query('SELECT * FROM agents WHERE ' + keys[0].toUpperCase() + '="' + values[0] + '"');
                        res.json(rows);
                } else {
                        let rows = await conn.query('SELECT * FROM agents');
                        res.json(rows);
                }
        } catch (err) {
                console.error('Error fetching data: ', err);
                res.status(500).send('Internal Server Error');
        } finally {
                if (conn) conn.end();
        }
});

/**
 * @swagger
 * /agents/{id}:
 *  get:
 *     summary: Get agent by ID
 *     description: Returns an agent by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the agent
 *     responses:
 *       200:
 *         description: Agent matching given ID
 *       500:
           description: Internal server error
 */

app.get('/agents/:id', async (req, res) => {

        var agentId = req.params.id;

        res.setHeader('X-Custom-Header', "The agent with the matching ID from the MariaDB database");
        res.setHeader('Content-Type', 'application/json');

        let conn;
        try {
                conn = await pool.getConnection();
                const rows = await conn.query('SELECT * FROM agents WHERE AGENT_CODE="' + agentId + '"');
                res.json(rows);
        } catch (err) {
                console.error('Error fetching data: ', err);
                res.status(500).send('Internal Server Error');
        } finally {
                if (conn) conn.end();
        }
});

/**
* @swagger
* /customers:
*   get:
*     summary: Returns customers from db
*     responses:
*       200:
*         description: All customers
*         content:
*           application/json
*/

app.get('/customers', async (req, res) => {

        res.setHeader('X-Custom-Header', "Customers from the MariaDB database");
        res.setHeader('Content-Type', 'application/json');

        let conn;
        try {
                conn = await pool.getConnection();
                const rows = await conn.query('SELECT * FROM customer');
                res.json(rows);
        } catch (err) {
                console.error('Error fetching data: ', err);
                res.status(500).send('Internal Server Error');
        } finally {
                if (conn) conn.end();
        }
});

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Delete a company by ID
 *     description: Deletes an company from the database via ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the company to delete
 *     responses:
 *       200:
 *         description: Company successfully deleted
 *       404:
 *         description: Company not found
 *       500:
 *         description: Database error
 */

app.delete('/companies/:id', async (req, res) => {
        var companyID = req.params.id;

        let conn;
        try {
                conn = await pool.getConnection();
                const del = await conn.query('DELETE FROM company WHERE company_id =' + companyID);
                console.log(del);
        } catch (err) {
                console.error('Error deleting data: ', err);
        } finally {
                if (conn) conn.end();
        }
});

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Add a new company
 *     description: Adds a new company to the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: The ID of the company
 *               name:
 *                 type: string
 *                 description: The name of the company
 *               city:
 *                 type: string
 *                 description: The location of the company
 *             required:
 *               - id
 *               - name
 *               - city
 *     responses:
 *       201:
 *         description: Company successfully added
 *         content:
 *           application/json:
 *             example: { "id": 1, "name": "ACME Co.", "city": 'Charlotte' }
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Database error
 */

app.post('/companies', async (req, res) => {
        let { id, name, city } = req.body;

        if (!id || !name || !city) {
                return res.status(400).json({ message: 'Missing information' });
        }

        let conn;
        try {
                conn = await pool.getConnection();
                const newPost = await conn.query('INSERT INTO company VALUES ("' + id + '", "' + name + '", "' + city + '")');
                console.log(newPost);
        } catch (err) {
                console.error('Error adding data: ', err);
        } finally {
                if (conn) conn.end();
        }
});

/**
 * @swagger
 * /companies/{id}:
 *   patch:
 *     summary: Update a company
 *     description: Updates a company listing in the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: The ID of the company
 *               name:
 *                 type: string
 *                 description: The name of the company
 *               city:
 *                 type: string
 *                 description: The location of the company
 *     responses:
 *       201:
 *         description: Company successfully updated
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Database error
 */

app.patch('/companies/:id', async (req, res) => {
        var companyID = req.params.id;

        let updatedData = req.body;

        if (!updatedData.name && !updatedData.city) {
                return res.status(400).json({ message: 'At least one field must be provided.' });
        }

        const updates = [];
        if (updatedData.name) {
                updates.push(`name = ?`);
        }
        if (updatedData.age) {
                updates.push(`age = ?`);
        }

        const sqlQuery = 'UPDATE users SET ${updates.join(", ")} WHERE id = ' + companyID;

        let conn;
        try {
                conn = await pool.getConnection();
                const update = await conn.query(sqlQuery);
                console.log(update);
        } catch (err) {
                console.error('Error updating data: ', err);
        } finally {
                if (conn) conn.end();
        }
});

/**
* @swagger
* /companies/{id}:
*   put:
*     summary: Update a company
*     description: Updates a company listing in the database
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               id:
*                 type: number
*                 description: The ID of the company
*               name:
*                 type: string
*                 description: The name of the company
*               city:
*                 type: string
*                 description: The location of the company
*           required:
*               - id
*               - name
*               - city
*     responses:
*       201:
*         description: Company successfully updated
*       400:
*         description: Invalid request body
*       500:
*         description: Database error
*/

app.put('/companies/:id', async (req, res) => {
        var companyID = req.params.id;

        let updatedData = req.body;

        if (!updatedData.name || !updatedData.city) {
                return res.status(400).json({ message: 'At least one field must be provided.' });
        }

        let conn;
        try {
                conn = await pool.getConnection();
                const update = await conn.query('UPDATE company SET name = ' + updatedData.name + ', city = ' + updatedData.city + ' WHERE id = ' + companyID);
                console.log(update);
        } catch (err) {
                console.error('Error updating data: ', err);
        } finally {
                if (conn) conn.end();
        }
});


app.listen(port, () => {
        console.log('Example app listening at ' + port)
});
