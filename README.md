Uses node.js, mostly socket.io.

First attempt at a rock paper scissors game, nearly had it.

Stopped working right around the part where I had to broadcast to rooms.
There was no particular reason I could find that none of the methods used to tell everyone in a room failed.
However, a tragedy occurred. This code is somewhat "spaghetti" and is somewhat unsuitable.

Things to consider next time I try to do this:
    Figure out how much to reuse, because it isn't all bad and it doesn't need to be thrown away.

    Consolidate ways of handling what I need to handle, 
        because there are too many of them that basically do the same thing.
    
    Clearer separation of challenges and server messages
    
    Have 3 columns, or even tabs
    
    Better way to handle challenges and names, something along those lines