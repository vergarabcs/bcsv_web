'use client'
import styles from './page.module.css'
import TodoList from './components/TodoList'
import { Amplify } from 'aws-amplify';
import config from '../amplifyconfiguration.json';
Amplify.configure(config);

export default function Home() {
  return (
    <main className={styles.main}>
      <TodoList />
    </main>
  )
}
