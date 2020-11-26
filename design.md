# one chat

## user search room

## user enter room

## user create room

## user become gm of the room

## save the message for user in the room by username


### db


**room onwer**

```
key: username
value: [room]
```

**black list**

```
key: owner:room
value [username]
```
**msg history**

```
key: room
value: [
{
  username,
  msg,
  time
}
]
```
