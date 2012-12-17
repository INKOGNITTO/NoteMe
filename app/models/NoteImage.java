/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package models;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.imageio.ImageIO;
import javax.persistence.Entity;
import javax.persistence.*;
import play.db.jpa.Blob;
import play.db.jpa.Model;
import play.libs.Codec;
import play.libs.MimeTypes;

@Entity
public class NoteImage extends Model {
    
    public String name;
    
    public Blob image;
    
    public int width;
    
    public int height;
    
    public String uuid;
    
    @ManyToOne (optional = false)
    public Note note;
    
    
    public NoteImage(Note note, File img) {
        try {
            this.note = note;
            this.name = img.getName();
            this.image = new Blob();
            this.uuid = Codec.UUID() + "-" + this.name;
            try {
                BufferedImage imge = ImageIO.read(img);
                this.width = imge.getWidth();
                this.height = imge.getHeight();
            } catch (IOException ex) {
                Logger.getLogger(NoteImage.class.getName()).log(Level.SEVERE, null, ex);
            }
            this.image.set(new FileInputStream(img), MimeTypes.getContentType(img.getName()));
        } catch (FileNotFoundException e) {
            e.printStackTrace(System.err);
        }
    }
    
    public static NoteImage fidByUuid(String uuid) {
        return find("uuid", uuid).first();
    }
    
}
