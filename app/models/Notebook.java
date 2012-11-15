package models;

import java.util.*;

import javax.persistence.*;
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


    @OneToMany(mappedBy="notebook")
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

    public List<Note> getNotes() {
        return notes;
    }

    public static String rename(Long notebookID, String newName) {
        Notebook notebook = findById(notebookID);
        notebook.name = newName;
        notebook.save();
        return newName;
    }


}
