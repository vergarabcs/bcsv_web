'use client'
import styles from './page.module.css'
import { Amplify } from 'aws-amplify';
import config from '../amplify_outputs.json';
import { GuestAccessExperiment } from './components/GuestAccessExperiment';
import { Authenticator } from '@aws-amplify/ui-react';

Amplify.configure(config);
export default function Home() {
  
  return (
    <main className={styles.main}>
      <Authenticator.Provider>
        <GuestAccessExperiment />
      </Authenticator.Provider>
    </main>
  )
}
