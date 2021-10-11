const express = require('express');
const { v4: uuid } = require('uuid');

const app = express();

app.use(express.json())
customers = [];

// VALIDANDO CPF
function validCPF(request, response, next){
    const { cpf } = request.headers;

    const customer = customers.find((find) => find.cpf === cpf)

    if(!customer) {
        return response.status(400).json({ error: 'CPF Invalid' })
    }

    request.customer = customer

    return next()
}

// SALDO PRA SAQUE
function getBalance(statement){
    const balance = statement.reduce((acc, operacion)=>{
        if(operacion.type === 'credit'){
            return acc + operacion.amount
        }else {
            return acc - operacion.amount
        }
    },0)
    return balance
}

// BUSCAR EXTRATO BANCARIO
app.get('/statement', validCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement)
})
// BUSCAR USUÁRIO
app.get('/list', validCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer)
})
// LISTAR POR DATA  
app.get('/statement/date', validCPF , (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        find => find.created_at.toDateString() === new Date(dateFormat).toDateString()
    )

    return response.json(statement)
})
// VALOR EM CONTA
app.get("/balance", validCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.json(`Saldo atual: $ ${balance}`);
})

// CRIANDO USUÁRIO
app.post('/account', (request, response) => {
    const { cpf, name } = request.body;

    const validExistCPF = customers.find(find => find.cpf === cpf);

    if(validExistCPF){
        return response.status(400).json({ error: 'CPF is exist' })
    }  

    customers.push({
        cpf,
        name,
        id: uuid(),
        created_at: new Date(),
        statement:[]
    })
    
    return response.status(201).send(customers);
})

// REALIZAR DEPOSITO
app.post('/deposit', validCPF,(request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation =  {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }
    customer.statement.push(statementOperation);

    return response.status(201).send();
})

// REALIZAR SAQUE
app.post('/withdraw', validCPF, (request, response) => {
    const { customer } = request;
    const { amount } = request.body;

    const balance = getBalance(customer.statement);

    if(balance < amount){
        return response.status(400).json({ error: 'Insufficient fund!' })
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }
    
    customer.statement.push(statementOperation);
    
    return response.status(201).json(statementOperation);
    return response.json()
})

// ATUALIZANDO USUÁRIO 
app.put('/account', validCPF, (request, response) => {
    const { customer } = request;
    const { name } = request.body;

    customer.name = name

    return response.send()
})

// DELETANTO USUÁRIO
app.delete('/delete', validCPF,(request, response) => {
    const { customer } = request;

    customers.splice(customer, 1)

    return response.send()
})

app.listen(3000,() => console.log('Server started!'))