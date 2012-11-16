package models;

import java.util.*;

import javax.persistence.*;
import play.data.binding.As;
import play.data.validation.*;

import play.db.jpa.Model;
import play.libs.Codec;


@Entity
@Table (name = "notes")
public class Note extends Model {

    @ManyToOne
    public User owner;    

    @Column(unique = true)
    public String publicID;
    
    public Boolean isPublic = false;

    @Column(columnDefinition = "TEXT")
    public String content;

    @ManyToMany(cascade = CascadeType.ALL)
    public List<Tag> tags = new ArrayList<Tag>();
	
    @ManyToOne(cascade = CascadeType.ALL)
    @Required
    public Notebook notebook;

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
        this.notebook = Notebook.findById(notebookID);
        this.owner = owner;
        this.creationDate = new Date();
        this.updateDate = new Date();
        this.publicID = generatePublicId();
        

    }
    
    public String generatePublicId() {
        String uuid = Codec.UUID();
        if(Note.findByPublicId(uuid)!=null) {
            return generatePublicId();
        }
        return uuid;
    }
    
    public static Note findByPublicId(String publicId) {
        return Note.find("publicID = ?", publicId).first();
    }

    public static Note create(String name, Long notebookID, Long userID) {
        Note note = new Note(name, notebookID, (User)User.findById(userID));
        note.save();
        return note;
    }
    
}
