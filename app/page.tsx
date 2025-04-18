'use client'
import styles from './page.module.css'
import { Amplify } from 'aws-amplify';
import config from '../amplify_outputs.json';
import { Authenticator } from '@aws-amplify/ui-react';
import { Main } from './components/Main';

Amplify.configure(config);
export default function Home() {
  
  return (
    <main className={styles.main}>
      <Authenticator.Provider>
        <Main />
      </Authenticator.Provider>
    </main>
  );
}
