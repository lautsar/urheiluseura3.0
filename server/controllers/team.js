const teamRouter = require('express').Router()
const {Team} = require('../models')


teamRouter.get('/', async (request,response) => {

    try{
        const teams = await Team.findAll()
        return response.json(teams)

    }catch(error){
        return response.status(400)
    }
})
teamRouter.get('/:id', async (request,response) => {

    try{
        const team = await Team.findByPk(request.params.id)
        if(team){
            return response.json(team)
        }else{
            return response.status(404).end()
        }

    }catch(error){
        return response.status(400).end()
    }
})
teamRouter.post('/', async (request, response) => {
    try {
        const {name, category } = request.body

        const finduser = await Team.findOne({where: {name: name}})
        if (finduser) {
            return response.status(401).json({error: 'Joukkue on jo olemassa'})
        }
        const team = new Team({
            name: name,
            category: category
        })

        const savedTeam = await Team.create(team.dataValues)

        return response.status(200).json(savedTeam)
    } catch (error) {
        return response.status(400)
    }
})

module.exports =  teamRouter