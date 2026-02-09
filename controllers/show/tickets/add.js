'use strict';
const { pool } = require("../../../db");


module.exports = async (req, res) => {

    const { user , amount, ticketId ,batchId, eventId} = req.body; //TODO:::მომავალში დავამათოთ სხვა ინფორმაციის დაფეტჩვა როცა ზუსტი პარამეტრები გვეცოდინება აპის
    const origin = req.headers.origin ?? 'http://localhost';

    const getPlatform = (origin) => {
        if (origin.includes('tkt.ge')) return 'tkt.ge';
        if (origin.includes('biletebi.ge')) return 'biletebi.ge';
        if (origin.includes('localhost')) return 'dev';
        return null;
    };

    const platform = getPlatform(origin);

    if (!platform) {return res.status(403).json({success: false,message: 'Forbidden'});}

    try{

        const soldAt = new Date().toISOString().slice(0, 19).replace('T', ' '); //იღებს ზუსტ თარიღს როდისაა ბილეთი ნაყიდი

        const [batchRows] = await pool.query(`select capacity, sold_count from show_batch where id = ? for update`,[batchId]);
        if (batchRows.length === 0) {return res.status(404).json({success: false,message: 'Batch not found'});}

        const {capacity, sold_count} = batchRows[0];

        if (sold_count + amount > capacity) {return res.status(400).json({success: false,message: 'Not enough tickets'});}

        const [isAlreadyBooked] = await pool.query('select * from tickets where ticket_id = ? and event_id = ? and batch_id = ? and buyer_id = ? limit 1', [ticketId, eventId, batchId, user])
        if(isAlreadyBooked.length !== 0)return res.status(400).json({success : false, message : 'You Have already Bought Tickets In This Batch'})

        await pool.query('insert into tickets (ticket_id, event_id, buyer_id, status, amount, sold_at, platform) values (?, ?, ?, ?, ?, ?, ?)' , [ticketId, eventId,user, 'valid' , amount, soldAt,platform ])
        await pool.query(`update show_batch set sold_count = sold_count + ? where id = ?`,[amount, batchId]);
        
        return res.status(200).json({success : true, message : 'Tickets Bought Successfully'})

        
    }catch(err){
        console.error(err);
        return res.status(500).json({success: false,message: 'Server error'});
    }
}