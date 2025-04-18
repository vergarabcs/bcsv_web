'use client'
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react"
import { useAsyncEffectOnce } from "../hooks/useAsyncEffectOnce";
import { generateClient } from "aws-amplify/api";
import { Schema } from "@/amplify/data/resource";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import WordFactory from "./WordFactory";

const client = generateClient<Schema>();

export const GuestAccessExperiment = () => {
  const [id, setId] = useState<string | undefined>('');
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  
  useAsyncEffectOnce(async () => {
    const session = await fetchAuthSession();
    console.log(session)
    setId(session.identityId);
  })

  return (
    <Authenticator>
      {() => (
        <main>
          <h1>Hello {user?.signInDetails?.loginId}</h1>
          <button onClick={signOut}>Sign out</button>
          <WordFactory />
        </main>
      )}
    </Authenticator>
  )
}