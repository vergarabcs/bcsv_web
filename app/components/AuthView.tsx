import { Authenticator } from "@aws-amplify/ui-react"

export const AuthView = () => {
  return (
    <Authenticator>
      {
        ({signOut, user}) => (
          <>
            {console.log(user)}
            <h1>Hello {user?.username}</h1>
            <button onClick={signOut}>Sign out</button>
          </>
        )
      }
    </Authenticator>
  )
}