const supertest = require('supertest')
const bcrypt = require('bcrypt')
const { User } = require('../models')
const { Event } =  require('../models')
const { Team } =  require('../models')
const app = require('../app')
const Cookies = require('universal-cookie')

const api = supertest(app)

const handleToken = (token) => {

    const finalToken = token.split(';')[0]
    return finalToken
    
}

let user
let loggedUser 
let cookies
let cryptedToken

let finalToken

let team


beforeEach(async () => {

    const saltRounds = 10
    const passwordHash = await bcrypt.hash('salainen1234', saltRounds)

    const initialUser = [
        {
            firstName: 'Pekka',
            lastName: 'Testinen',
            username: 'Pekka35',
            password: passwordHash,
            address: 'Osoite',
            postalCode: '00300',
            city: 'Helsinki',
            phoneNumber: '0509876543',
            email: 'osoite@email.com'
        }
    ]
    await User.destroy({
        where: {},
        truncate: true,
        cascade: true
    })
    user = await User.create(initialUser[0])

    const initialTeams = [
        {
            name: 'Naiset 3',
            category: 'N2D'
        },
        {
            name: 'EBT SB',
            category: 'N4D'
        },
        {
            name: 'EBT',
            category: 'N3D'
        },
    ]
    await Team.destroy({
        where: {},
        truncate:true,
        cascade: true
    })
    team = await Team.create(initialTeams[0])
    await Team.create(initialTeams[1])
    await Team.create(initialTeams[2])

    const dateString = '2023-06-19T12:30:00.000Z'
    const timestamp = Date.parse(dateString)
    const dateTime = new Date(timestamp)

    const initialEvent = [
        {   

            opponent: 'Honka I B',
            location: 'Espoonlahden urheiluhalli',
            dateTime: dateTime,
            description: 'Tuomarointi',
            teamId: team.id,
            createdById: user.id,
            
        }
    ]
    
    await Event.destroy({
        where: {},
        truncate: true,
        cascade: true
    })
    await Event.create(initialEvent[0])

    user = {username: 'Pekka35', password: 'salainen1234'}
    loggedUser = await api.post('/api/login').send(user)
    cookies = new Cookies(loggedUser.headers['set-cookie'])
    cryptedToken = cookies.cookies[0]

    finalToken = handleToken(cryptedToken)

    team = await Team.findOne({where: {name: 'EBT SB'}})


})

test('event can be added with correct input', async () =>{

    const newEvent = {

        team: team.id,
        opponent: 'Honka I B',
        location: 'Espoonlahden urheiluhalli',
        date:'2023-06-19',
        time:'12:30',
        description: 'Lipunmyynti'
    }

    await api
        .post('/api/event')
        .set('Cookie', finalToken)
        .send(newEvent)
        .expect(200)
})


test('event can be added without description', async () => {

    const newEvent = {

        team: team.id,
        opponent: 'Honka I B',
        location: 'Espoonlahden urheiluhalli',
        date:'2023-06-19',
        time:'12:30',
        description: ''
    }

    await api
        .post('/api/event')
        .set('Cookie', finalToken)
        .send(newEvent)
        .expect(200)
})


test('cannot add an event if team is missing', async () => {

    const newEvent = {

        team: '',
        opponent: 'Honka I B',
        location: 'Espoonlahden urheiluhalli',
        date:'2023-06-19',
        time:'12:30',
        description: 'Lipunmyynti'
    }

    const result = await api
        .post('/api/event')
        .set('Cookie', finalToken)
        .send(newEvent)
        .expect(401)
    
    expect(result.body.error).toContain('Virheellinen tiimi')
})

test('cannot add an event if opponent is missing', async () => {



    const newEvent = {

        team: team.id,
        opponent: '',
        location: 'Espoonlahden urheiluhalli',
        date:'2023-06-19',
        time:'12:30',
        description: 'Lipunmyynti'
    }

    const result = await api
        .post('/api/event')
        .set('Cookie', finalToken)
        .send(newEvent)
        .expect(401)
    
    expect(result.body.error).toBe('Virheellinen vastustaja')
})

test('cannot add an event if location is missing', async () => {

    const newEvent = {

        team: team.id,
        opponent: 'Honka I B',
        location: '',
        date:'2023-06-19',
        time:'12:30',
        description: 'Lipunmyynti'
    }

    const result = await api
        .post('/api/event')
        .set('Cookie', finalToken)
        .send(newEvent)
        .expect(401)

    expect(result.body.error).toBe('Virheellinen sijainti')
})

test('cannot add an event if date is missing', async () => {

    const newEvent = {

        team: team.id,
        opponent: 'Honka I B',
        location: 'Espoonlahden urheiluhalli',
        date:'',
        time:'12:30',
        description: 'Lipunmyynti'
    }

    const result = await api
        .post('/api/event')
        .set('Cookie', finalToken)
        .send(newEvent)
        .expect(401)

    expect(result.body.error).toBe('Virheellinen päivämäärä')
})

test('cannot add an event if time is missing', async () => {

    const newEvent = {

        team: team.id,
        opponent: 'Honka I B',
        location: 'Espoonlahden urheiluhalli',
        date:'2023-06-19',
        time:'',
        description: 'Lipunmyynti'
    }

    const result = await api
        .post('/api/event')
        .set('Cookie', finalToken)
        .send(newEvent)
        .expect(401)

    expect(result.body.error).toBe('Virheellinen aika')
})



test('cannot add an event if token is invalid', async () => {

    const newEvent = {

        team: team.id,
        opponent: 'Honka I B',
        location: 'Espoonlahden urheiluhalli',
        date:'2023-06-19',
        time:'12:30',
        description: 'Lipunmyynti'
    }

    const result = await api
        .post('/api/event')
        .set('Cookie', 'InvalidToken')
        .send(newEvent)
        .expect(401)

    expect(result.body.error).toContain('Token puuttuu')
})


test('correct number of events in database', async () => {
    
    const NewEvent = {

        team: team.id,
        opponent: 'Honka I B',
        location: 'Espoonlahden urheiluhalli',
        date: '2023-06-19',
        time:'12:30',
        description: 'Siivous'
    }

    await api
        .post('/api/event')
        .set('Cookie', finalToken)
        .send(NewEvent)
        .expect(200)
    
    const events = await Event.findAll()
    expect(events.length).toBe(2)

})

