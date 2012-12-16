/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers;

import models.*;
import play.mvc.Mailer;

public class Mails extends Mailer {
    
    public static void resetPassword(User user,String newPass) {
        setSubject("Resetované heslo v noteMe");
        setFrom("notemeapp@gmail.com");
        addRecipient(user.email);
        send(user,newPass);
    }
    
}
