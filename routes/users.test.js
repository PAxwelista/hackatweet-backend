const request = require('supertest');
const app = require('../app');

let token ;

describe("POST /users/signup" ,() => {
    it("should return a good status code", async ()=>{
        const res = await request(app).post('/users/signup').send({
            firstname : "axel",
            username :  "boba",
            password : "bam"
        })
        expect(res.statusCode).toBe(200);

    })
    it ("should return result : false" ,async ()=>{
        const res = await request(app).post('/users/signup').send({
            firstname : "axel",
            username :  "boba",
            password : "bam"
        })
        expect(res.statusCode).toBe(200);
        expect(res.body.result).toBe(false);
    })
})

describe("POST /users/signin" ,() => {
    it("should return a good status code and a token", async ()=>{
        const res = await request(app).post('/users/signin').send({
            username :  "boba",
            password : "bam"
        })
        token = res.body.token
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();

    })
    it ("should return result : false" ,async ()=>{
        const res = await request(app).post('/users/signin').send({
            username :  "boba",
            password : "bama"
        })
        expect(res.statusCode).toBe(200);
        expect(res.body.result).toBe(false);
    })
})

describe("GET /firstname/:token" ,() => {
    it("should return a good status code and a firstname", async ()=>{
        const res = await request(app).get(`/users/firstname/${token}`)

        expect(res.statusCode).toBe(200);
        expect(res.body.firstname).toBe("axel");

    })
    it ("should return result : false" ,async ()=>{
        const res = await request(app).get(`/users/firstname/zae`)
        expect(res.statusCode).toBe(200);
        expect(res.body.result).toBe(false);
    })
})