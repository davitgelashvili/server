'use strict';
const { pool } = require("../../../db");


module.exports = async (req, res) => {

    const { user , amount, ticketId , eventId} = req.body; //TODO:::მომავალში დავამათოთ სხვა ინფორმაციის დაფეტჩვა როცა ზუსტი პარამეტრები გვეცოდინება აპის
    const origin = req.headers.origin || '';
    
    let platform = null;
    
    if (origin.includes('tkt.ge')) {
        platform = 'tkt.ge';
    } else if (origin.includes('biletebi.ge')) {
        platform = 'biletebi.ge';
    }else if (origin.includes('localhost')){
        platform = 'dev'
    }else {
        return res.status(403).json({success : false , message : 'Forbidden'})
    }

    try{

        const soldAt = new Date().toISOString().slice(0, 19).replace('T', ' '); //იღებს ზუსტ თარიღს როდისაა ბილეთი ნაყიდი

        const [isAlreadyBooked] = await pool.query('select amount from tickets where ticket_id = ? and event_id = ?', [ticketId, eventId])

        if(isAlreadyBooked.length !== 0)return res.status(400).json({success : false, message : 'You Have Already Bought Tickets'})

        await pool.query('insert into tickets (ticket_id, event_id, buyer_id, status, amount, sold_at, platform) values (?, ?, ?, ?, ?, ?, ?)' , [ticketId, eventId,user, 'valid' , amount, soldAt,platform ])
        return res.status(200).json({success : true, message : 'Tickets Bought Successfully'})

    }catch(err){
        console.error(err);
        return res.status(500).json({success: false,message: 'Server error'});
    }
}