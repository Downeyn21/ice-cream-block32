require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const express = require("express");
const app = express();

app.use(require("morgan")("dev"));
app.use(express.json());

app.get("/api/flavors", async (req, res, next) => {
    try {
        const SQL = /* SQL */ `
            SELECT * from flavors ORDER BY id DESC
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error)
    }
}) 

app.get("/api/flavors/:id", async (req, res, next) => {
    try {
        const SQL = /* SQL */ `
            SELECT * from flavors
            WHERE id=$1
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.send(response.rows);
    } catch (error) {
        next(error)
    }
})

app.put("/api/flavors/:id", async (req, res, next) => {
    try {
        const SQL = /* SQL */ `
            UPDATE flavors
            SET name=$1, is_favorite=$2, updated_at=now()
            WHERE id=$3
            RETURNING *
        `;
        const response = await client.query(SQL, [
            req.body.name, req.body.is_favorite, req.params.id
        ]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error)
    }
})

app.post("/api/flavors", async (req, res, next) => {
    try {
        const SQL = /* SQL */ `
            INSERT INTO flavors(name, is_favorite)
            VALUES($1, $2)
            RETURNING *

        `;
        const response = await client.query(SQL, [
            req.body.name, req.body.is_favorite
        ]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error)
    }
})

app.delete("/api/flavors/:id", async (req, res, next) => {
    try {
        const SQL = /* SQL */ `
            DELETE from flavors
            WHERE id=$1
        `;
        await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        next(error)
    }
})


async function init() {
    await client.connect();
    console.log("client connected")

    let SQL = /* SQL */ `
        DROP TABLE IF EXISTS flavors;
            CREATE TABLE flavors(
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                is_favorite BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
            );
    `;
    await client.query(SQL);
    console.log("table created");

    SQL = /* SQL */ `
        INSERT INTO flavors(name) VALUES('chocolate');
        INSERT INTO flavors(name, is_favorite) VALUES('strawberry', true);
    `; 

    await client.query(SQL)
    console.log("data seeded")

    const port = process.env.PORT;
    app.listen(port, () => console.log(`listening on ${port}`))
}

init()