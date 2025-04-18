'use client'
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState, lazy, Suspense } from "react"
import { useAsyncEffectOnce } from "../hooks/useAsyncEffectOnce";
import { generateClient } from "aws-amplify/api";
import { Schema } from "@/amplify/data/resource";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import styles from '../main.module.css'

// Lazy load the games components
const WordFactory = lazy(() => import("./WordFactory"));
// You can add more games here as you develop them
// Example: const GameTwo = lazy(() => import("./GameTwo"));

const client = generateClient<Schema>();

// Define game interfaces
interface Game {
  id: string;
  title: string;
  description: string;
  component: React.LazyExoticComponent<any>;
}

export const Main = () => {
  const [id, setId] = useState<string | undefined>('');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  
  // Define your games collection - easy to add more games in the future
  const games: Game[] = [
    {
      id: 'word-factory',
      title: 'Word Factory',
      description: 'Create words from a set of letters in this fun word game!',
      component: WordFactory
    },
    // You can add more games here as you develop them
    // Example:
    // {
    //   id: 'game-two',
    //   title: 'Game Two',
    //   description: 'Description for Game Two',
    //   component: GameTwo
    // },
  ];

  useAsyncEffectOnce(async () => {
    const session = await fetchAuthSession();
    setId(session.identityId);
  });

  // Render the active game or show the game selection grid
  const renderContent = () => {
    if (activeGame) {
      const game = games.find(g => g.id === activeGame);
      
      if (game) {
        const GameComponent = game.component;
        
        return (
          <div className={styles.activeGame}>
            <button 
              className={styles.backButton} 
              onClick={() => setActiveGame(null)}
            >
              ← Back to Games
            </button>
            <h2>{game.title}</h2>
            <Suspense fallback={<div>Loading game...</div>}>
              <GameComponent />
            </Suspense>
          </div>
        );
      }
    }

    return (
      <>
        <h2 className={styles.sectionTitle}>My Games Collection</h2>
        <div className={styles.gameGrid}>
          {games.map((game) => (
            <div 
              key={game.id} 
              className={styles.gameCard}
              onClick={() => setActiveGame(game.id)}
            >
              <div className={styles.gameCardHeader}>
                <h3 className={styles.gameCardTitle}>{game.title}</h3>
              </div>
              <div className={styles.gameCardContent}>
                <p className={styles.gameCardDescription}>{game.description}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <Authenticator>
      {() => (
        <main className={styles.mainContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome, {user?.signInDetails?.loginId}</h1>
            <button className={styles.signOutButton} onClick={signOut}>Sign out</button>
          </div>
          {renderContent()}
        </main>
      )}
    </Authenticator>
  )
}