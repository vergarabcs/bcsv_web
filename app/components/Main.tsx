'use client'
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { useEffect, useState, lazy, Suspense } from "react"
import { useAsyncEffectOnce } from "../hooks/useAsyncEffectOnce";
import { generateClient } from "aws-amplify/api";
import { Schema } from "@/amplify/data/resource";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import styles from '../main.module.css'

// Lazy load the games components
const WordFactory = lazy(() => import("./WordFactory"));
const ScheduleFinder = lazy(() => import("../apps/ScheduleFinder/ScheduleFinder"));
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
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const { user, route } = useAuthenticator((context) => [context.user, context.route]);
  
  // Define your games collection - easy to add more games in the future
  const games: Game[] = [
    {
      id: 'word-factory',
      title: 'Word Factory',
      description: 'Create words from a set of letters in this fun word game!',
      component: WordFactory
    },
    {
      id: 'scheduleFinder',
      title: 'Schedule Finder',
      description: 'Find common schedule with your friends',
      component: ScheduleFinder
    }
    // You can add more games here as you develop them
    // Example:
    // {
    //   id: 'game-two',
    //   title: 'Game Two',
    //   description: 'Description for Game Two',
    //   component: GameTwo
    // },
  ];

  // Get the current authentication state
  useAsyncEffectOnce(async () => {
    try {
      const session = await fetchAuthSession();
      setId(session.identityId);
      
      // Check if we have an identityId but no user - this means we're a guest
      if (session.identityId && !user) {
        setIsGuest(true);
      }
    } catch (error) {
      console.error('Error fetching auth session:', error);
    }
  });

  // Handle guest access
  const handleGuestAccess = async () => {
    try {
      // For guest access, just call fetchAuthSession to get credentials
      const session = await fetchAuthSession();
      if (session.identityId) {
        setId(session.identityId);
        setIsGuest(true);
      }
    } catch (error) {
      console.error('Error accessing as guest:', error);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsGuest(false);
      setId(undefined);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
    <>
      {route === 'signIn' && !isGuest ? (
        <Authenticator>
          {/* This slot provides a default Sign In form */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>Or continue without an account</p>
            <button onClick={handleGuestAccess}>Continue as Guest</button>
          </div>
        </Authenticator>
      ) : (
        <main className={styles.mainContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {isGuest 
                ? 'Welcome, Guest' 
                : `Welcome, ${user?.signInDetails?.loginId || 'User'}`}
            </h1>
            <button className={styles.signOutButton} onClick={handleSignOut}>Sign out</button>
          </div>
          {renderContent()}
        </main>
      )}
    </>
  )
}