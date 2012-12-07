/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers;

import com.google.gson.Gson;
import hash.Passwords;
import models.User;
import play.mvc.*;

@With(Secure.class)
public class AccountManager extends Controller {
    
    public static void accountManager(){
        renderArgs.put("user", User.findByEmail(session.get("username")));
        render("dialogs/accountmanager.html");
    }
    
    public static void manageAccount(String name, String oldPass, String newPass, String newPassCheck){
        User actualUser = User.findByEmail(session.get("username"));
        
        // test zhody zadaneho hesla s heslom pouzivatela
        if (!Passwords.matches(oldPass, actualUser.password)){
            validation.addError("oldPass", "Chybné heslo");
        }
        
        //test ak bolo zadane nove heslo, ci ma aspon 6 znakov
        if( (!newPass.equals("")) && (newPass.length() < 6) ){
            validation.addError("newPass", "Heslo je krátke, zadajte aspoň 6 znakov");
        }
        // test zhody novych hesiel
        if ((!newPassCheck.equals("") || !newPass.equals("")) && !newPass.equals(newPassCheck)){
            validation.addError("newPassCheck", "Heslá sa nezhodujú");
        }
        
        // ak nastala nejaka chyba, zasle sa error a neide sa dalej
        if(validation.hasErrors()){
            Gson gson = new Gson();
            error(Http.StatusCode.BAD_REQUEST,gson.toJson(validation.errorsMap()));
        }
        
        actualUser.name = name;
        
        if (!newPass.equals("")){
            actualUser.password = Passwords.hashPassword(newPass);
        }
        actualUser.save();
    }
    
    public static void deleteAccountDialog(){
        renderArgs.put("user", User.findByEmail(Security.connected()));
        render("dialogs/deleteaccount.html");
    }
    
    public static void deleteAccount(String password) {
        checkAuthenticity();
        User user = User.findByEmail(session.get("username"));
        if(Passwords.matches(password, user.password)){
            user.remove();
            renderJSON("{\"next\":\""+Router.reverse("Secure.logout").url+"\"}");
        } else {
            validation.addError("password", "Chybné heslo");
            Gson gson = new Gson();
            error(Http.StatusCode.BAD_REQUEST,gson.toJson(validation.errorsMap()));
        }
    }
       
}
