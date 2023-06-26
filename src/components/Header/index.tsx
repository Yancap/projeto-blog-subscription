import {cloneElement} from 'react'
import styles from './styles.module.scss'
import { SignInButton } from '../SignInButton'
import Link from 'next/link'
import { useRouter } from 'next/router'

export const Header = () => {

  //Hook que pega as informações de rota atual
  const { asPath } = useRouter()
  // asPath >> é a rota atual
  
  return (
    <header className={styles.header}>
      <button onClick={() => console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)}>

      </button>
        <div className={styles.content}>
            <img src="/images/logo.svg" alt="ig.news" />
            <nav>
              <Link href="/" className={asPath === '/' ? styles.active : ''}>
                <span >Home</span>
              </Link>
              <Link href="/posts" className={asPath === '/posts' ? styles.active : ''} prefetch>
                <span>Posts</span>
              </Link>
            </nav>
            <SignInButton />
        </div>
    </header>
  )
}
