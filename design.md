# one chat

## user enter room
if no room:
  set key room:username value md5(password) # create room
  set key username:md5(password):room value [] #create blacklist for the room
  set key room value [] # create message history for the room

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
