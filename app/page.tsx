'use client'
import styles from './page.module.css'
import { Authenticator } from '@aws-amplify/ui-react';
import { Main } from './lib/components/Main';

export default function Home() {
  
  return (
    <main className={styles.main}>
      <Authenticator.Provider>
        <Main />
      </Authenticator.Provider>
    </main>
  );
}
