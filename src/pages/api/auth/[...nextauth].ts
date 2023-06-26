import NextAuth, { AuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
//Importa as consultas do FaunaDB
import { query } from 'faunadb'
//Importa a config do FaunaDB
import { fauna } from '../../../services/fauna'

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      //Criar uma aplicação de auth no github para cada projeto!!!
      clientId: process.env.GITHUB_CLIENT_ID as string, //Usa o Id do app de autenticação do GitHb (Configurar no Github)
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string //Chave privada para autenticação, 
    }),
  ],
  callbacks: {
    //
    async session({session}){
      const email = session.user?.email ?? ''
      //Busca no FaunaDB a inscrição ativa do usuário
      try{
        const userActiveSubscribe = await fauna.query(
          query.Get(
            query.Intersection([
              query.Match(
                query.Index('subscription_by_user_ref'),
                query.Select(
                  "ref",
                  query.Get(
                    query.Match(
                      query.Index('user_by_email'),
                      query.Casefold(email)
                    )
                  )
                )
              ),
              query.Match(
                query.Index('subscription_by_status'),
                "active"
              )
            ])
          )
        )
        return {
          ...session,
          activeSubscription: userActiveSubscribe
        }
      } catch {
        return {
          ...session,
          activeSubscription: null
        }
      }

      
    },
    async signIn({user}){
      const { email } = user
      try{
        //Método de escrita das Querys
        /*
          Se não existir o Email do Usuário na Banco de dados, vai criar.
          Se existir o Email do Usuário, vai retornar esse email
        */
        await fauna.query(
          query.If( //Se
            query.Not( //Não
              query.Exists( //Existir Email o Email do usuário
                query.Match( // equivalente ao WHERE do SQL
                  query.Index("user_by_email"), //Busca o email do usuário com base no Index 'user_by_email'
                  query.Casefold(user.email as string) //sem diferenças entre maiúsculas e minusculas
                )
              )
            ),
            query.Create( //Crie um dado na coleção users
              query.Collection('users'),
              { data: { email }}
            ), //Se existir, busque esse dado e retorne
            query.Get( //Equivalente ao Select do SQL
              query.Match(
              query.Index("user_by_email"),
              query.Casefold(user.email as string)
            ))
          )
        )
        return true
      } catch(error){
        return false
      }
    }
  } 
}
export default NextAuth(authOptions)