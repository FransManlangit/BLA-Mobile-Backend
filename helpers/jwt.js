const {expressjwt: jwt} = require("express-jwt");

function authJwt() {
    const secret = process.env.secret;
    const api = process.env.API_URL;

    return jwt({
        secret,
        algorithms: ['HS256']
    })

    .unless({
        path: [
            { url: /\/api\/v1\/balances(.*)/ , methods: ["GET","POST","PUT","DELETE","OPTIONS"] },
            { url: /\/api\/v1\/violations(.*)/ , methods: ["GET","POST","PUT","DELETE","OPTIONS"] },
            { url: /\/api\/v1\/requests(.*)/ , methods: ["GET","POST","PUT","DELETE","OPTIONS"] },
            { url: /\/api\/v1\/schedules(.*)/ , methods: ["GET","POST","PUT"] },
            { url: /\/api\/v1\/documents(.*)/ , methods: ["GET", "POST","DELETE", "PUT", "OPTIONS"] },
            { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS", "POST"] },
            { url: /\/api\/v1\/users(.*)/ , methods: ['GET','POST','PUT','OPTIONS'] },
            { url: /\/api\/v1\/products(.*)/ , methods: ["GET", "POST", "PUT","OPTIONS"] },
            { url: /\/api\/v1\/categories(.*)/ , methods: ["GET", "OPTIONS"] },
            { url: /\/api\/v1\/orders(.*)/ , methods: ["GET","POST","PUT","OPTIONS"] },
            { url: /\/api\/v1\/clearances(.*)/ , methods: ["GET","POST","PUT","OPTIONS"] },
            { url: /\/api\/v1\/paymongoTokenGenerate(.*)/ , methods: ["GET","POST","PUT","OPTIONS"] },
          
            // `${api}/userRequests/:userid`,
            // `${api}/users/userSchedule/:userid`,
            `${api}/users`,
            `${api}/users/login`,
            `${api}/users/register`,
            // `${api}/requests/requestItems/:id`,
        ]
    })
}

async function isRevoked(req, payload, done) {
        if(!payload.isAdmin) {
            done(null, true)
        }

        done();
    }


module.exports = authJwt
