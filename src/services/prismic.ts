import * as Prismic from '@prismicio/client'

export function getPrismicClient(){
    const prismic = Prismic.createClient(
        process.env.PRISMIC_ENDPOINT as string, //Variável Ambiente com o Endpoint
        {
            accessToken: process.env.PRISMIC_ACCESS_TOKEN as string //Variável Ambiente com o Token de Segurança
        }
    )

    return prismic
}