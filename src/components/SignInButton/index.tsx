import React from 'react'
import { FaGithub } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'
import { signIn, signOut, useSession } from 'next-auth/react'

import styles from './styles.module.scss'

export const SignInButton = () => {
  //Hook que retornar se o usuário está logado ou não
  const {data: session} = useSession()
  
  return session ? (
    <button type='button' 
      className={styles.button}
      onClick={() => signOut()}>
        <FaGithub color='#04d361' />
          <span>
            {session.user?.name}
          </span>
        <FiX 
          color='737380' 
          className={styles.closed}
          />
    </button>
  ) : (
    <button 
      type='button' 
      className={styles.button}
      onClick={() => signIn('github')}
    >
        <FaGithub color='#eba417' />
        <span>
          Sign in
        </span>
    </button>
  )
}
