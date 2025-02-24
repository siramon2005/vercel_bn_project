const http = require('http');
const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors')
const bodyParser = require('body-parser');
const hostname = '127.0.0.1';
const port = 3000;
const fs = require('fs');

const {readFileSync} = require("fs");
var path = require("path");
let cer_part = path.join(process.cwd(), 'isrgrootx1.pem');

var urlencodedParser = bodyParser.urlencoded({ extended: false })

//create the connerction to database
const connection = mysql.createConnection({
    host : 'gateway01.us-west-2.prod.aws.tidbcloud.com',
    user : 'vbnG85Td7KfF98y.root' ,
    password: "HQR6r1jIKWa71tpL", 
    database: 'imi_miniproject',
    port:4000,
    ssl:{
        ca:fs.readFileSync(cer_part)
    }
});

app.use(cors())
app.use(express.json())
app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

app.get('/', (req, res) => {
    res.json({
        "Name": "mini.project",
        "Author": "Symptom Checker System",
        "APIS": [
            { "api_name": "/getsymptoms/", "method": "get" },
            { "api_name": "/getdisease/", "method": "get" },
            { "api_name": "/getdisease_symptoms/", "method": "get" },
            { "api_name": "/addsymptoms/", "method": "post" },
            { "api_name": "/adddisease/", "method": "post" },
            { "api_name": "/adddisease_symptoms/", "method": "post" },
            { "api_name": "/editsymptoms/:id", "method": "put" },
            { "api_name": "/editdisease/:id", "method": "put" },
            { "api_name": "/editdisease_symptoms", "method": "put" },
            { "api_name": "/deletesymptoms/:id", "method": "delete" },
            { "api_name": "/deletedisease/:id", "method": "delete" },
            { "api_name": "/deletedisease_symptoms/:id", "method": "delete" }
        ]
    });
});

// ดึงข้อมูลทั้งหมด
app.get('/getsymptoms', (req, res) => {
    connection.query('SELECT * FROM symptoms', (err, results) => {
        if (err) throw err;
        console.log("Symptoms Data:", results);
        res.json(results);
    });
});

app.get('/getdisease', (req, res) => {
    connection.query('SELECT disease_id, name, description FROM disease', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/getdisease_symptoms', (req, res) => {
    const query = 'SELECT id, disease_id, symptom_id FROM disease_symptoms';
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Error fetching data');
        }
        console.log(results); // ตรวจสอบข้อมูล
        res.json(results);
    });
});

// เพิ่มข้อมูล
app.post('/addsymptoms', express.json(), (req, res) => {
    let sql = 'INSERT INTO symptoms (name) VALUES (?)';
    let values = [req.body.name];

    connection.query(sql, values, function(err, results) {
        if (err) {
            console.error("Error inserting symptom:", err);
            return res.status(500).json({ error: true, msg: "Cannot Insert", details: err });
        }
        res.json({ error: false, msg: "Inserted", id: results.insertId });
    });
});

app.post('/adddisease', urlencodedParser, (req, res) => {
    let sql = 'INSERT INTO disease (name, description) VALUES (?, ?)';
    let values = [req.body.name, req.body.description];

    connection.query(sql, values, (err, results) => {
        if (err) {
            console.log(err);
            return res.json({ error: true, msg: "Cannot Insert" });
        }
        res.json({ error: false, data: results, msg: "Inserted" });
    });
});

app.post('/adddisease_symptoms', (req, res) => {
    const { disease_id, symptom_id } = req.body;

    if (!disease_id || !symptom_id) {
        return res.status(400).json({ error: "กรุณาเลือกโรคและอาการ" });
    }

    const sql = "INSERT INTO disease_symptoms (id, disease_id, symptom_id) VALUES (NULL, ?, ?)";
    connection.query(sql, [disease_id, symptom_id], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ error: "ไม่สามารถบันทึกข้อมูลได้" });
        }
        res.json({ message: "บันทึกข้อมูลสำเร็จ" });
    });
});

// แก้ไขข้อมูล
app.put('/editsymptoms/:id', express.json(), (req, res) => {
    let sql = 'UPDATE symptoms SET name = ? WHERE symptom_id = ?';
    let values = [req.body.name, req.params.id];

    connection.query(sql, values, (err, results) => {
        if (err) {
            console.error("Error updating symptom:", err);
            return res.status(500).json({ error: true, msg: "Cannot Update" });
        }
        res.json({ error: false, msg: "Updated" });
    });
});

app.put('/editdisease/:id', urlencodedParser, (req, res) => {
    let sql = 'UPDATE disease SET name = ?, description = ? WHERE disease_id = ?';
    let values = [req.body.name, req.body.description, req.params.id];

    connection.query(sql, values, (err, results) => {
        if (err) throw err;
        res.json({ error: false, data: results, msg: "Updated" });
    });
});

app.put('/editdisease_symptoms/:id', urlencodedParser, (req, res) => {
    let sql = 'UPDATE disease_symptoms SET disease_id = ?, symptom_id = ? WHERE id = ?';
    let values = [req.body.disease_id, req.body.symptom_id, req.params.id];

    connection.query(sql, values, (err, results) => {
        if (err) throw err;
        res.json({ error: false, data: results, msg: "Updated" });
    });
});

// ลบข้อมูล
app.delete('/deletesymptoms/:id', (req, res) => {
    let sql = 'DELETE FROM symptoms WHERE symptom_id = ?';
    let values = [req.params.id];

    connection.query(sql, values, (err, results) => {
        if (err) {
            console.error("Error deleting symptom:", err);
            return res.status(500).json({ error: true, msg: "Cannot Delete" });
        }
        res.json({ error: false, msg: "Deleted" });
    });
});

app.delete('/deletedisease/:id', (req, res) => {
    let sql = 'DELETE FROM disease WHERE disease_id = ?';
    let values = [req.params.id];

    connection.query(sql, values, (err, results) => {
        if (err) throw err;
        res.json({ error: false, data: results, msg: "Deleted" });
    });
});

app.delete('/deletedisease_symptoms/:id', (req, res) => {
    console.log("กำลังลบ id:", req.params.id);  // ตรวจสอบว่า id ถูกส่งมาหรือไม่

    // ตรวจสอบว่ามีการส่ง id มาหรือไม่ และตรวจสอบว่า id เป็นตัวเลข
    if (!req.params.id || isNaN(req.params.id)) {
        return res.status(400).json({ error: 'ไม่พบ id ที่ต้องการลบ หรือ id ไม่ถูกต้อง' });
    }

    let sql = 'DELETE FROM disease_symptoms WHERE id = ?';
    let values = [req.params.id];

    // การ query ข้อมูลจากฐานข้อมูล
    connection.query(sql, values, (err, results) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการติดต่อฐานข้อมูล' });
        }

        // ตรวจสอบว่ามีการลบข้อมูลหรือไม่
        if (results.affectedRows > 0) {
            res.json({ error: false, msg: "ลบข้อมูลสำเร็จ" });
        } else {
            res.status(404).json({ error: true, msg: "ไม่พบข้อมูลที่ต้องการลบ" });
        }
    });
});