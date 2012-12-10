package models;

import java.util.*;

import javax.persistence.*;
import hash.Passwords;
import play.data.validation.*;
import play.db.jpa.Model;
import controllers.CRUD;
import play.db.jpa.GenericModel;
import play.db.jpa.JPA;

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
    
    public Boolean isAdmin;
    
    @Transient
    @CRUD.Exclude
    @CheckWith(controllers.App.PasswordCheckCheck.class)
    public String passwordCheck;
    
    @OneToMany (cascade = CascadeType.ALL)
    @OrderColumn
    public List<Notebook> notebooks = new LinkedList<Notebook>();
    
    @OneToOne (cascade = CascadeType.ALL)
    public Notebook defaultNbSharedNotes;
    
   
    /**
     * poznamky, ktore su pouzivatelovi vyzdielane od inych pouzivatelov
     * on nie je ich vlastnik, on ich iba vidi, nemoze ich editovat
     */
    @ManyToMany (mappedBy="sharedWith")
    public Set<Note> notOwnedNotes = new HashSet<Note>(); 
    
    
    //@ManyToMany(fetch = FetchType.LAZY)
    //public List<Note> notes = new LinkedList<Note>();

    public User(String email, String name, String password) {
        this.email = email;
        this.name = name;
        this.password = Passwords.hashPassword(password);
        this.isAdmin = false;
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
    
    public List<Note> getAllNotes() {
        Query noteQuery = JPA.em().createQuery("select note from Note note join note.notebooks nb join nb.owner owner"
                + " where owner = :user")
                .setParameter("user", this);
        return noteQuery.getResultList();
    }
    
    public List<Note> getOwnedNotes() {
        Query noteQuery = JPA.em().createQuery("select note from Note note where note.owner = :owner").setParameter("owner", this);
        return noteQuery.getResultList();
    }
    
    
    
    public Note getFirstNote() {
        return null; //TODO
    }
    
    public List<Tag> getTags() {
        Query query = JPA.em().createQuery("select tag from Tag tag where tag.owner = :this order by tag.id desc").setParameter("this", this);
        return query.getResultList();
    }
    
    @Override
    public String toString() {
        return email + " (" + name + ")";
    }
    
    public void remove(){
        List<Tag> tags = getTags();
        for(Tag tag: tags){
            tag.remove();
        }
        List<Note> notes = getAllNotes();
        for(Note note: notes){
            note.remove();
        }
        this.delete();
    }

}
