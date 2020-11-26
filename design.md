# one chat

## user search room

## user enter room

## user create room

## user become gm of the room

## save the message for user in the room by username


### db


**room onwer**

```
key: owner
value: [room]
```

**black list**

```
key: owner:md5(password):room
value [username]
```

**user list in room**
```
key: room
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
