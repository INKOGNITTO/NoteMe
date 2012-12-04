package models;

import java.util.*;
import javax.persistence.*;
import org.hibernate.annotations.Cascade;
import play.data.validation.Required;
import play.db.jpa.Model;
import play.mvc.Scope;

@Entity
@Table(name = "notebooks")
public class Notebook extends Model {

    @Required
    public String name;
   
    /**
     * Prispievatelia - pouzivatelia, ktori maju pristupny poznamkovy blok a
     * mozu do neho vkladat poznamky
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

    /**
     * Vsetky poznamky vlastnene prihlasenym pouzivatelom -> odstranit 
     * Z poznamok nevlastnenych prihlasenym pouzivatelom odobrat z sharedWith
     * pouzivatela
     */
    public void remove() {
        User actualUser = User.findByEmail(Scope.Session.current.get().get("username"));

        List<Note> notesToRemove = new ArrayList();
        for (Note note : notes) {
            // ak pouzivatel nie je vlastnik, treba odstranit referenciu User.notOwnedNotes
            if (!note.owner.equals(actualUser)) {
                actualUser.notOwnedNotes.remove(note);
                actualUser.save();
            }
            notesToRemove.add(note);
        }
        // zmaze vsetky poznamky zoznamu do ktoreho sa povkladali poznamky na zmazanie
        for (Note note : notesToRemove) {
            note.remove();
        }
        // zmazanie poznamky z pozn. bloku
        actualUser.notebooks.remove(this);
        actualUser.save();
        this.refresh();
        //ak uz nema ziadneho contributora -> zmazat z databazy
        if (this.contributors.isEmpty()) {
            /* Ak notebook, ktory chce pouzivatel zmazat je defaultny nb
             * t.j. nb do ktoreho sa mu ukladaju poznamky ktore mu vyzdielavaju iny pouzivatelia
             * treba ho odobrat z User.defaultNbSharedNotes
             */
            if (actualUser.defaultNbSharedNotes.equals(this)) {
                actualUser.defaultNbSharedNotes = null;
                actualUser.save();
            }
            this.delete();
        }
    }
}
