const eventRouter = require('express').Router()

const {Event} = require('../models')
const {User} = require('../models')
const {Team} = require('../models')
const {validateEventInput} = require('./validate_input.js')
const { tokenExtractor } = require('../utils/middleware')




eventRouter.post('/', tokenExtractor, async(request, response) => {

    try{
        
        const { team, opponent, location, date, time, description} = request.body
        if (!team) {
            return response.status(401).json({error: 'Virheellinen tiimi'})           
        }
        if (!opponent) {
            return response.status(401).json({error: 'Virheellinen vastustaja'})           
        }

        if (!location) {
            return response.status(401).json({error: 'Virheellinen sijainti'})           
        }

        if (!date) {
            return response.status(401).json({error: 'Virheellinen päivämäärä'})           
        }

        if (!time) {
            return response.status(401).json({error: 'Virheellinen aika'})           
        }

        const checkEventErrors = validateEventInput(team, opponent, date, time, location, description)

        if (checkEventErrors.length > 0) {
            return response.status(401).json({error: `${checkEventErrors}`})
        
        }
        const finduser = await User.findByPk(request.decodedToken.id)

        if (!finduser) {
            return response.status(401).json({error: 'Käyttäjän hakeminen epäonnistui'})
        }

        const newdate = new Date(date)
        const [hours, minutes] = time.split(':')
        
        newdate.setHours(hours)
        newdate.setMinutes(minutes)

        

        const findteam = await Team.findByPk(team)

        if (!findteam) {
            return response.status(401).json({error: 'Tiimin hakeminen epäonnistui'})
        }

        const event = new Event({
            createdById: finduser.dataValues.id,
            opponent:opponent,
            location:location,
            dateTime : newdate,
            description: description,
            teamId: team
        })

        const savedEvent = await Event.create(event.dataValues)

      
    
        return response.status(200).json(savedEvent)
    }catch(error){
        return response.status(400)
    }


})

module.exports =  eventRouter