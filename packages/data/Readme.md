# Data Testing Initializer

This package allows you to create a [@msw/data]("https://github.com/mswts/data") type-safe database. It will read nested
arrays as a `many of` relationship and objects as a `one of` relationship.

### Installation

```shell
npm i --save-dev @testing-initializer/data
```

or with Yarn:

```shell
yarn add -D @testing-initializer/data
```

### Usage

First make you have your types available:

```ts
interface User {
  id: number
  name: string
}

interface ToDo {
  id: number
  name: string
}

interface Project {
  id: number
  name: string
  date: string
  user: User
  toDos: ToDo[]
}

interface APITypes {
  user: User
  toDo: ToDo
  project: Project
}
```

Proceed to create your mock database based on this types.

```ts
import { createDatabase, generateId } from "@testing-initializer/data"

const db = createDatabase<APITypes>({
  user: {
    id: () => generateId("user-pk"),
    name: () => `User ${generateId("user-name")}`,
  },
  toDo: {
    id: () => generateId("toDo-pk"),
    name: () => `Todo ${generateId("toDo-name")}`,
  },
  project: {
    id: () => generateId("project-pk"),
    date: () => new Date().toISOString(),
    name: () => `Project ${generateId("project-name")}`,
    user: oneOf("user"),
    toDos: manyOf("toDo"),
  },
})
```

Now you can use all database methods available in [@msw/data]("https://github.com/mswts/data"):

```ts
db.user.create()
db.user.findFirst({ ... })
db.project.findMany({ ... })
```

## License

This project is licensed under the terms of the
[MIT license](https://github.com/JoseRFelix/testing-initializer/blob/main/LICENSEr)
