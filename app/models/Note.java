package models;

import controllers.Security;
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
    
    @Required
    public String name;

    @ManyToOne
    public User owner;
    
    @Column(unique = true)
    public String publicID;
   
    public Boolean isPublic;
    
    @Column(columnDefinition = "TEXT")
    public String content;
    
    @ManyToMany
    public Set<Tag> tags = new HashSet<Tag>();
    
    @ManyToMany
    public Set<User> sharedWith = new HashSet<User>();
    
    @ManyToMany(mappedBy = "notes")
    @Required
    public Set<Notebook> notebooks = new HashSet<Notebook>();
   
    @Temporal(TemporalType.TIMESTAMP)
    @As("dd.MM.yyyy hh:mm:ss")
    public Date creationDate = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    @As("dd.MM.yyyy hh:mm:ss")
    public Date updateDate = new Date();
    
    @OneToMany(mappedBy = "note", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    public Set<NoteImage> images = new HashSet();

    public Note(String name, Long notebookID, User owner) {
        this.name = name;
        this.owner = owner;
        this.creationDate = new Date();
        this.updateDate = new Date();
        this.isPublic = false;
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
        this.isPublic = false;
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
                .setParameter("o", (User)User.findByEmail(Scope.Session.current.get().get("username")));
        List<Tag> ownedTags = q.getResultList();
        return ownedTags;
    }

    public String rename(String newName) {
        this.name = newName;
        this.save();
        return newName;
    }

    public void remove() {
        User actualUser = User.findByEmail(Scope.Session.current.get().get("username"));
        //ak poznamka patri prihlasenemu pouzivatelovi
        if (this.owner.equals(actualUser)) {

            // vyhladaj vsetky bloky, v ktorych je tato poznamka
            Query q = JPA.em().createQuery("select nb from Notebook nb where :n member of nb.notes and nb.linkParent = null")
                    .setParameter("n", this);
            List<Notebook> notebookWithNote = q.getResultList();
            //v tychto pozn. blokoch zmaz tuto (this) poznamku
            for (Notebook n : notebookWithNote) {
                n.removeNote(this);
                n.save();
            }
            
            this.refresh();
            //zmaz vsetky obrazky asociovane s poznamkou
            for (NoteImage noteImage : this.images) {
                noteImage.image.getFile().delete();
                noteImage.delete();
            }
            // uz poznamka nie je v ziadnom bloku, zmaz ju z db
            this.delete();
            
        } else { 
            
            //vybrat Notebook vlastneny aktualnym pouzivatelom, v ktorom sa nachadza pozadovana poznamka
            Query q = JPA.em().createQuery("select nb from Notebook nb where :o = nb.owner and :n member of nb.notes")
                    .setParameter("o", actualUser)
                    .setParameter("n", this);
            List<Notebook> notebookWithNote = q.getResultList();
            // odstrani poznamku z notebookov (vlastne len z jedneho, ale pracujem z List-om, taze tak)
            for (Notebook n : notebookWithNote) {
                n.removeNote(this);
                n.save();
            }
            // odstran vsetky znacky aktualneho pouzivatela
            tags.removeAll(actualUser.getTags());
            // odzdiela sa od pouzivatela
            sharedWith.remove(actualUser);
            save();
        }

    }
    
    @Override
    public String toString(){
        return this.name;
    }
    
}
