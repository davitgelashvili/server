'use strict';

const { pool } = require("../../../db");

module.exports = async(req,res) => {

    const { id } = req.params;

    try{

        const [ticket] = await pool.query('select * from tickets where event_id = ?' , [id])
        if(ticket.length === 0) return res.status(204).json({success : false , message : 'No Tickets Found'}) 

        return res.status(200).json({success: true, message : ticket}) //გვიბრუნებს ბილეთებს აიდის მიხედვით

    }catch(err){
        return res.status(500).json({success: false, message : 'Server Error'})
    }
}