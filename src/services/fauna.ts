import { Client } from 'faunadb'

//Criação da conexão com o Banco de Dados
export const fauna = new Client({
    secret: process.env.FAUNADB_KEY as string
})