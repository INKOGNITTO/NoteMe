package controllers;

import com.google.gson.*;
import hash.Passwords;
import java.util.logging.Level;
import models.NoteImage;
import models.User;
import play.data.validation.*;
import play.data.validation.Check;
import play.db.jpa.Blob;
import play.mvc.*;
import play.mvc.Http.StatusCode;


public class App extends Controller{

    /**
     * pomocna trieda pre overenie udajov pri prihlasovani pouzivatela
     */
    public static class PasswordCheck extends Check{
        @Override
        public boolean isSatisfied(Object user, Object password) {
            setMessage("Chybné meno alebo heslo");
            return Security.authenticate(((LoginCheck)user).email, (String)password);
        }
    }
    
    /**
     * Pomocna metoda pre kontrolu zhody zadanych hesiel pri registracii pouzivatela
     */
    public static class PasswordCheckCheck extends Check {
        @Override
        public boolean isSatisfied(Object user, Object passwordcheck) {
            setMessage("Heslá sa nezhodujú");
            return (((User)user).password).equals((String)passwordcheck);
        }
    }
    
    /**
     * Pomocna trieda pre kontrolu udajov pri prihlasovani pouzivatela 
     */
    public class LoginCheck {
        @Required (message = "Zadajte e-mail")
        @Email (message = "Zadajte platný email") 
        public String email;
        
        @Required (message = "Zadajte heslo")
        @CheckWith(PasswordCheck.class)
        public String password;
        
        public LoginCheck(String email, String password) {
            this.email = email;
            this.password = password;
        }
    }
    
   /**
    * Prihlasovanie pouzivatela
    * @param user pouzivatel
    */
    public static void authenticate(@Valid LoginCheck user) {
    	if(validation.hasErrors()) {
            Gson gson = new Gson();
            error(StatusCode.BAD_REQUEST,gson.toJson(validation.errorsMap()));
    	} 
        
        session.put("username",user.email);
        //presmeruj na povodnu URL
        String url = flash.get("url");
        if(url == null) {
            url = Router.reverse("NoteManager.index").url; //default url
        }
        renderJSON("{\"next\":\""+url+"\"}");
    }

    /**
     * Resgitracia pouzivatela
     * @param user pouzivatel
     */
    public static void register(@Valid User user) {
        if(validation.hasErrors()) {
            Gson gson = new Gson();
            error(StatusCode.BAD_REQUEST,gson.toJson(validation.errorsMap()));
        } 
        
        User newUser = new User(user.email, user.name, user.password);
        if(User.findAll().isEmpty()){
            user.isAdmin = true;
        }
        newUser.save();
        newUser.setDefaults();
        session.put("username",user.email);
        renderJSON("{\"next\":\"/manage\"}");

    }
    
    public static void logout() {
    	session.clear();
        try {
            Secure.login();
        } catch (Throwable ex) {
            java.util.logging.Logger.getLogger(App.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
  
    public static void manageAccount(String name, String oldPass, String newPass, String newPassCheck){
        User actualUser = User.findByEmail(session.get("username"));
        
        // test zhody zadaneho hesla s heslom pouzivatela
        if (!Passwords.matches(oldPass, actualUser.password)){
            validation.addError("oldPass", "Chybné heslo");
        }
        
        //test ak bolo zadane nove heslo, ci ma aspon 6 znakov
        if( (!newPass.equals(null))&&(newPass.length() < 6) ){
            validation.addError("newPPass", "Heslo je krátke, zadajte aspoň 6 znakov");
        }
        
        // test zhody novych hesiel
        if (!newPass.equals(newPassCheck)){
            validation.addError("newPassCheck", "Heslá sa nezhodujú");
        }
        
        // ak nastala nejaka chyba, zasle sa error a neide sa dalej
        if(validation.hasErrors()){
            Gson gson = new Gson();
            error(StatusCode.BAD_REQUEST,gson.toJson(validation.errorsMap()));
        }
        
        if (!name.equals(null)){
            actualUser.name = name;
        }
        if (!newPass.equals(null)){
            actualUser.password = newPass;
        }
        actualUser.save();
    }
    
    public static void accountManager(){
        renderArgs.put("user", User.findByEmail(session.get("username")));
        render("dialogs/accountmanager.html");
    }
    
    
    public static void index() {
        NoteManager.index();
    }
    
    /**
     * Generovanie skriptu obsahujuceho reverzne cesty pre AJAX
     */
    public static void jsRoutes() {
        if(Security.isConnected()) {
            response.setContentTypeIfNotSet("text/javascript");
            render("jsRoutes");
        } else {
            error(StatusCode.FORBIDDEN, "Nie ste prihlásený");
        }
    }
    
    /**
     * Obrazky v poznamkach
     * @param uuid identifikator obrazka
     */
    public static void getNoteImage(String uuid) {
        Blob image = NoteImage.fidByUuid(uuid).image;
        response.setContentTypeIfNotSet(image.type());
        renderBinary(image.get());
    }
    
}
