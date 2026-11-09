const mysql = require('mysql2/promise');

async function checkData() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'skilltechardb'
        });
        
        let [rows] = await connection.query(`
            SELECT p.id, p.name, p.slug
            FROM catalog_product p
            WHERE p.name LIKE '%33F%'
        `);
        console.log("Data for 33F:", JSON.stringify(rows, null, 2));
        
        await connection.end();
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkData();
