# ts-data-parser

## Example

```ts
  import * as data from "ts-data-parser"
  
  type Person = {
    firstname: string
    lastname: string
    age: number
    title?: string
  }
  
  const personParser = data.object<Person>({
    firstname: data.string,
    lastname: data.string,
    age: data.number,
    title: data.optional(data.string)
  })
  
  const getPeople = async () => {
    const response = await fetch("http://api.example.com/people")
    const body = await response.json()
    const people = data.runParser(data.array(personParser), body)
    return people
  }
```
