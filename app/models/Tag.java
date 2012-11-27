package models;

import java.util.LinkedList;
import java.util.List;
import javax.persistence.*;
import play.data.validation.Required;
import play.db.jpa.JPA;
import play.db.jpa.Model;
import play.mvc.Scope;

@Entity
@Table(name = "tags")
public class Tag extends Model {

    @Required
    public String name;
    @ManyToOne
    @Required
    public User owner;
    @ManyToMany()
    @OrderColumn
    public List<Note> notes = new LinkedList<Note>();

    public Tag(String name, User user) {
        this.name = name;
        this.owner = user;
    }

    public static Tag create(String name, Long userID) {
        Tag tag = new Tag(name, User.<User>findById(userID));
        tag.save();
        return tag;
    }

    public String rename(String newName) {
        this.name = newName;
        this.save();
        return newName;
    }

    public void remove() {
        // vyhladaj vsetky poznamky, v ktorych je tento tag a ktore su pristupne prihlasenemu pouzivatelovi
        Query q = JPA.em().createQuery("select nt from Note nt where :n member of nt.tags and :u member of nt.owner")
                .setParameter("n", this)
                .setParameter("u", User.findByEmail(Scope.Session.current.get().get("username")));
        List<Note> noteWithTag = q.getResultList();
        //v tychto poznamkach zmaz tento (this) tag
        for (Note n : noteWithTag) {
            n.tags.remove(this);
            n.save();
        }
        // ak uz tag nie je v ziadnej poznamke, zmaz ju z db
        this.refresh();
        if (this.notes.isEmpty()) {
            this.delete();
        }
    }

    public void removeFromNote(Long noteId) {
        Note note = Note.findById(noteId);
        note.tags.remove(this);
        note.save();
    }
}
