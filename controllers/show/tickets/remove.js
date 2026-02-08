const { pool } = require("../../../db")

module.exports = async(req,res) => {

    const {user, ticketId, eventId} = req.body

    try{

        const [ticket] = await pool.query('select * from tickets where buyer_id = ? and event_id = ? and ticket_id = ?', [user, eventId , ticketId])
        if(ticket.length === 0) return res.status(404).json({success: false , message : "Ticket Not Found"})

        await pool.query('update tickets where buyer_id = ? and event_id = ? and ticket_id = ? set status = ?', [user, eventId , ticketId, 'refunded'])
        return res.status(200).json({success : true, message : "Ticket Refuned"})

    }catch(err){
        console.error(err)
        return res.status(500).json({success : false , message : 'Server Error'})
    }
}