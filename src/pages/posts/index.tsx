import React from 'react'
import styles from './styles.module.scss'
import Head from 'next/head'
import { GetStaticProps } from 'next'
import { getPrismicClient } from '@/services/prismic'
import { RTNode } from '@prismicio/client/dist/types/value/richText'
import { RichText } from 'prismic-dom'
import Link from 'next/link'

type Post = {
    slug: string;
    title: string;
    excerpt: string;
    updateAt: string;
}
interface PostsProps{
    posts: Post[]
}

interface Content {
    type: string;
    text: string;
}

type Func = (content: RTNode) => Content
export default function Posts ({posts}: PostsProps){
  return (
    <>
        <Head>
            <title> Posts | Ygnews</title>
        </Head>
        <main className={styles.container}>

            <div className={styles.posts}>
                {
                posts.map(post => (
                    <Link href={`/posts/${post.slug}`} key={post.slug}>
                        <time>{post.updateAt}</time>
                        <strong>{post.title}</strong>
                        <p>
                            {post.excerpt}
                        </p>
                    </Link>
                ))
                }

                
            </div>
        </main>
    </>
  )
}

//Função que gera a pagina estatica no servidor Next
export const getStaticProps: GetStaticProps = async () => {
    //Conexão com o prismic
    const prismic = getPrismicClient()
/*
    Método que busca todos as postagens por meio de seu "Type", retornando
    apenas seu Titulo e seu Conteúdo    
*/
    const response = await prismic.getAllByType("post", 
    { 
        fetch: ["Post.title", "Post.content"], //Escolhe o que será retornado
        pageSize: 100, //Escolhe a "paginação", ou seja, a quantidade retornado
    })
    
    const posts = response.map( post => {
        const {content} = post.data
        const excerpt = (content as Content[])
        return {
            slug: post.uid,
            title: RichText.asText(post.data.title), //Formata o Titulo
            excerpt: excerpt.find((content) => {
                return content.type === 'paragraph' 
            })?.text ?? ' ', //Retorna o paragrafo se ele existir
            updateAt: new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }) //Formata a data em um padrão BR
        }
    })   
    
    //Esse Props vai diretamente para o componente
    return {
        props: {
            posts
        }
    }
}