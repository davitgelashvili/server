const tickets = require(".")
const { pool } = require("../../../db")



module.exports = async (req,res) => {
    try{

        const tickets = await pool.query('select * from tickets')
        if(tickets.length === 0) return res.status(204)
        
        return res.status(200).json({success: true, message : tickets})

    }catch(err){
        return res.status(500).json({success : false, message : "Server Error"})
    }
}