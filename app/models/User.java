package models;

import java.util.*;

import javax.persistence.*;
import hash.Passwords;
import play.data.validation.*;
import play.db.jpa.Model;
import controllers.CRUD;

@Entity
@Table(name = "users")
public class User extends Model {

    @Required (message = "E-mail je požadovaný")
    @Email (message = "Zadajte platný email")
    @Unique (message = "Na zadaný email je už registrovaný používateľ")
    public String email;
    
    public String name;
    
    @MinSize(value = 6, message = "Heslo je krátke, zadajte aspoň 6 znakov")
    @Required (message = "Zadajte svoje nové heslo")
    @CRUD.Exclude
    public String password;
    
    @Transient
    @CheckWith(controllers.App.PasswordCheckCheck.class)
    public String passwordCheck;
    
    @ManyToMany
    @OrderColumn
    public List<Notebook> notebooks = new LinkedList<Notebook>();
    
    //@ManyToMany(fetch = FetchType.LAZY)
    //public List<Note> notes = new LinkedList<Note>();

    public User(String email, String name, String password) {
        this.email = email;
        this.name = name;
        this.password = Passwords.hashPassword(password);
    }
    
    public void setDefaults() {
        Notebook defaultNotebook = Notebook.create("Moje poznámky", this.id);
        this.notebooks.add(0, defaultNotebook);
        defaultNotebook.save();
        this.save();
    }

    public static List<User> getAll() {
        return User.<User>findAll();
    }

    public static User findByEmail(String email) {
        return find("byEmail", email).first();
    }

    public static List<Notebook> findNotebooks(Long user) {
        return User.<User>findById(user).notebooks;
    }
    
    @Override
    public String toString() {
        return email + " (" + name + ")";
    }

}
