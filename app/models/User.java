package models;

import java.util.*;

import javax.persistence.*;
import hash.Passwords;
import play.data.validation.*;
import play.db.jpa.Model;

@Entity
@Table(name = "users")
public class User extends Model {

    @Required
    @Email
    public String email;
    
    @Required
    public String name;
    
    @Required
    public String password;
    
    @ManyToMany
    @OrderColumn
    public List<Notebook> notebooks = new LinkedList<Notebook>();

    public User(String email, String name, String password) {
        this.email = email;
        this.name = name;
        this.password = Passwords.hashPassword(password);
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

}
