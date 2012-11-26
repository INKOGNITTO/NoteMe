package controllers.admin;

import controllers.*;
import models.*;
import play.mvc.*;

@CRUD.For(User.class)
@With(Secure.class)
@Check("admin")
public class Users extends CRUD {
    
    @Before
    static void globals() {
        renderArgs.put("user", User.findByEmail(session.get("username")));
    }
    
}
