import { generateClient } from 'aws-amplify/data'
import { Schema } from '@/amplify/data/resource'
import { useEffect, useState } from 'react'

const client = generateClient<Schema>()

export default function TodoList() {
    const [todos, setTodos] = useState<Schema['Todo'][]>([]);

    useEffect(() => {
        const sub = client.models.Todo.observeQuery().subscribe({
            next: ({items}) => {
                setTodos([...items])
            }
        })

        return () => sub.unsubscribe();
    }, [])

    const createTodo = async () => {
        await client.models.Todo.create({
            content: window.prompt("Todo content?"),
            isDone: false
        })
    }

    return <div>
        <button onClick={createTodo}>Add new todo</button>
        <ul>
            {todos.map(({id, content}) => (
                <li key={id}>{content}</li>
            ))}
        </ul>
    </div>
}