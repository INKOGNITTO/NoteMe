package models;

import java.util.*;

import javax.persistence.*;
import play.Logger;
import play.data.binding.As;
import play.data.validation.*;
import play.db.jpa.JPA;

import play.db.jpa.Model;
import play.libs.Codec;
import play.mvc.Scope;

@Entity
@Table(name = "notes")
public class Note extends Model {

    @ManyToOne
    public User owner;
    
    //@ManyToMany
    //public List<User> users = new LinkedList<User>();

    @Column(unique = true)
    public String publicID;

    public Boolean isPulbic;
    
    @Column(columnDefinition = "TEXT")
    public String content;
    
    @ManyToMany
    public Set<Tag> tags = new HashSet<Tag>();
	
    @ManyToMany(mappedBy = "notes")
    @Required
    public Set<Notebook> notebooks = new HashSet<Notebook>();

    @Required
    public String name;

    @Temporal(TemporalType.TIMESTAMP)
    @As("dd.MM.yyyy hh:mm:ss")
    public Date creationDate = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    @As("dd.MM.yyyy hh:mm:ss")
    public Date updateDate = new Date();

    public Note(String name, Long notebookID, User owner) {
        this.name = name;
        //this.notebooks.add((Notebook)Notebook.findById(notebookID));
        this.owner = owner;
        this.creationDate = new Date();
        this.updateDate = new Date();
        this.isPulbic = false;
        //this.publicID = generatePublicId();
    }

    public String generatePublicId() {
        String uuid = Codec.UUID();
        if (Note.findByPublicId(uuid) != null) {
            return generatePublicId();
        }
        this.publicID = uuid;
        this.save();
        this.refresh();
        return uuid;
    }

    public void unsharePublicId() {
        this.isPulbic = false;
        this.save();
        this.refresh();
    }

    public static Note findByPublicId(String publicId) {
        return Note.find("publicID = ?", publicId).first();
    }

    public static Note create(String name, Long notebookID, Long userID) {
        Note note = new Note(name, notebookID, (User) User.findById(userID));
        note.save();
        note.refresh();
        note.notebooks.add((Notebook) Notebook.findById(notebookID));
        note.save();
        return note;
    }

    public Set<Tag> getTags() {
        return tags;
    }

    public List<Tag> getOwnedTags() {
        Query q = JPA.em().createQuery("select tag from Tag tag where :n member of tag.notes and tag.owner = :o")
                .setParameter("n", this)
                .setParameter("o", this.owner);
        List<Tag> ownedTags = q.getResultList();
        return ownedTags;
    }

    public String rename(String newName) {
        this.name = newName;
        this.save();
        return newName;
    }

    public void remove() {
        // vyhladaj vsetky bloky, v ktorych je tato poznamka a ktore su pristupne prihlasenemu pouzivatelovi
        Query q = JPA.em().createQuery("select nb from Notebook nb where :n member of nb.notes and :u member of nb.contributors")
                .setParameter("n", this)
                .setParameter("u", User.findByEmail(Scope.Session.current.get().get("username")));
        List<Notebook> notebookWithNote = q.getResultList();
        //v tychto pozn. blokoch zmaz tuto (this) poznamku
        for (Notebook n : notebookWithNote) {
            n.notes.remove(this);
            n.save();
        }
        // ak uz poznamka nie je v ziadnom bloku, zmaz ju z db
        this.refresh();
        if (this.notebooks.isEmpty()) {
            this.delete();
        }

    }
}
