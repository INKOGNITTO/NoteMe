package models;

import java.util.*;
import javax.persistence.*;
import org.hibernate.annotations.Cascade;
import play.data.validation.Required;
import play.db.jpa.Model;

@Entity
@Table(name = "notebooks")
public class Notebook extends Model {

    @Required
    public String name;

    /**
     * Prispievatelia - pouzivatelia, ktori maju pristupny
     * poznamkovy blok a mozu do neho vkladat poznamky
     */
    @ManyToMany(mappedBy = "notebooks")
    public List<User> contributors = new LinkedList<User>();


    @ManyToMany(cascade = CascadeType.ALL)
    @Cascade(org.hibernate.annotations.CascadeType.ALL)
    @OrderColumn
    public List<Note> notes = new LinkedList<Note>();


    public Notebook(String name, User user) {
        this.name = name;
        this.contributors.add(user);
    }

    public static Notebook create(String name, Long userID) {
        Notebook notebook = new Notebook(name, User.<User>findById(userID));
        notebook.save();
        return notebook;
    }

    public String rename(String newName) {
        this.name = newName;
        this.save();
        return newName;
    }

    
}
