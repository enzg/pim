# one chat

## user enter room
``` python

if !room:
  set  room:username => md5(password) # create room
  set  room:username:md5(password) => [] #create blacklist for the room
  set  room:MSG => [] # create message history for the room
else:
  set room:USERS => [username]
  
```

## create room
``` python
  set key room:username => md5(password)
```
## user become gm of the room

if is the first user of the room 

## create message history for the room
```python
set key room => []
```
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
